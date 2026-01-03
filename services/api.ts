import { AppData, Asset, Category, CharacterState } from '../types';
import { supabase } from './supabase';

// 注意：getUserId 函数已移除，直接使用 await supabase.auth.getUser() 获取用户

// 从 Supabase 获取所有数据（分类和资产）- 全局共享，所有人都可以查看
export async function fetchData(): Promise<AppData> {
  try {
    // 获取分类（全局，所有人可查看）
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .order('z_index', { ascending: true });

    if (categoriesError) throw categoriesError;

    // 获取资产（全局，所有人可查看）
    const { data: assetsData, error: assetsError } = await supabase
      .from('assets')
      .select('*');

    if (assetsError) throw assetsError;

    // 转换为应用格式
    const categories: Category[] = (categoriesData || []).map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      zIndex: cat.z_index,
      defaultAssetId: cat.default_asset_id || undefined
    }));

    const assets: Asset[] = (assetsData || []).map((asset: any) => ({
      id: asset.id,
      name: asset.name,
      categoryId: asset.category_id,
      src: asset.public_url
    }));

    return { categories, assets };
  } catch (error) {
    console.error('获取数据错误:', error);
    return { categories: [], assets: [] };
  }
}

// 保存数据到 Supabase（仅管理员可用）
export async function saveData(data: AppData): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('用户未登录');
    }

    // 检查是否是管理员
    const { isAdmin } = await import('./admin');
    const adminStatus = await isAdmin();
    if (!adminStatus) {
      throw new Error('只有管理员可以编辑资产和分类');
    }

    // 保存分类
    for (const category of data.categories) {
      const { error } = await supabase
        .from('categories')
        .upsert({
          id: category.id,
          name: category.name,
          z_index: category.zIndex,
          default_asset_id: category.defaultAssetId || null,
          created_by: user.id
        } as any, {
          onConflict: 'id'
        });

      if (error) throw error;
    }

    // 删除不存在的分类
    const categoryIds = new Set(data.categories.map(c => c.id));
    const { data: existingCategories } = await supabase
      .from('categories')
      .select('id');

    if (existingCategories) {
      const toDelete = (existingCategories as any[])
        .filter((c: any) => !categoryIds.has(c.id))
        .map((c: any) => c.id);

      if (toDelete.length > 0) {
        await supabase
          .from('categories')
          .delete()
          .in('id', toDelete);
      }
    }

    // 保存资产
    for (const asset of data.assets) {
      // 查找对应的数据库记录以获取 storage_path
      const { data: existingAsset } = await supabase
        .from('assets')
        .select('storage_path')
        .eq('id', asset.id)
        .single();

      const { error } = await supabase
        .from('assets')
        .upsert({
          id: asset.id,
          category_id: asset.categoryId,
          name: asset.name,
          storage_path: (existingAsset as any)?.storage_path || `assets/${asset.id}`,
          public_url: asset.src,
          created_by: user.id
        } as any, {
          onConflict: 'id'
        });

      if (error) throw error;
    }

    // 删除不存在的资产
    const assetIds = new Set(data.assets.map(a => a.id));
    const { data: existingAssets } = await supabase
      .from('assets')
      .select('id');

    if (existingAssets) {
      const toDelete = (existingAssets as any[])
        .filter((a: any) => !assetIds.has(a.id))
        .map((a: any) => a.id);

      if (toDelete.length > 0) {
        await supabase
          .from('assets')
          .delete()
          .in('id', toDelete);
      }
    }

    return true;
  } catch (error) {
    console.error('保存数据错误:', error);
    throw error;
  }
}

// 上传资产文件到 Supabase Storage（仅管理员可用）
export async function uploadAssets(files: File[], categoryId: string): Promise<AppData['assets']> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('用户未登录');
    }

    // 检查是否是管理员
    const { isAdmin } = await import('./admin');
    const adminStatus = await isAdmin();
    if (!adminStatus) {
      throw new Error('只有管理员可以上传资产');
    }

    const uploadedAssets: Asset[] = [];
    const errors: string[] = [];

    for (const file of files) {
      try {
        // 验证文件类型
        if (!file.type.startsWith('image/')) {
          errors.push(`${file.name}: 不是有效的图片文件`);
          continue;
        }

        // 生成唯一ID
        const assetId = `${categoryId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const storagePath = `assets/${categoryId}/${assetId}`;

        // 上传到 Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('character-assets')
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('上传文件错误:', uploadError);
          // 检查是否是 bucket 不存在
          if (uploadError.message?.includes('not found') || uploadError.message?.includes('Bucket')) {
            throw new Error('Storage bucket "character-assets" 不存在。请在 Supabase Dashboard 中创建该 bucket。');
          }
          // 检查是否是权限问题
          if (uploadError.message?.includes('permission') || uploadError.message?.includes('policy')) {
            throw new Error('没有上传权限。请检查 Storage 策略设置。');
          }
          errors.push(`${file.name}: ${uploadError.message || '上传失败'}`);
          continue;
        }

        // 获取公共URL
        const { data: { publicUrl } } = supabase.storage
          .from('character-assets')
          .getPublicUrl(storagePath);

        // 保存到数据库
        const { error: dbError } = await supabase
          .from('assets')
          .insert({
            id: assetId,
            category_id: categoryId,
            name: file.name.replace(/\.[^/.]+$/, ''), // 移除扩展名
            storage_path: storagePath,
            public_url: publicUrl,
            created_by: user.id
          } as any);

        if (dbError) {
          console.error('保存资产到数据库错误:', dbError);
          // 尝试删除已上传的文件
          await supabase.storage
            .from('character-assets')
            .remove([storagePath]);
          errors.push(`${file.name}: 保存到数据库失败 - ${dbError.message}`);
          continue;
        }

        uploadedAssets.push({
          id: assetId,
          name: file.name.replace(/\.[^/.]+$/, ''),
          categoryId,
          src: publicUrl
        });
      } catch (fileError) {
        // 如果是关键错误（如 bucket 不存在），直接抛出
        if (fileError instanceof Error && fileError.message.includes('bucket')) {
          throw fileError;
        }
        errors.push(`${file.name}: ${fileError instanceof Error ? fileError.message : '未知错误'}`);
      }
    }

    // 如果有错误且没有成功上传的文件，抛出错误
    if (errors.length > 0 && uploadedAssets.length === 0) {
      throw new Error(`上传失败:\n${errors.join('\n')}`);
    }

    // 如果有部分错误，记录到控制台
    if (errors.length > 0) {
      console.warn('部分文件上传失败:', errors);
    }

    return uploadedAssets;
  } catch (error) {
    console.error('上传资产错误:', error);
    throw error;
  }
}

// 删除资产（仅管理员可用）
export async function deleteAsset(assetId: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('用户未登录');
    }

    // 检查是否是管理员
    const { isAdmin } = await import('./admin');
    const adminStatus = await isAdmin();
    if (!adminStatus) {
      throw new Error('只有管理员可以删除资产');
    }

    // 获取资产信息
    const { data: asset, error: fetchError } = await supabase
      .from('assets')
      .select('storage_path')
      .eq('id', assetId)
      .single();

    if (fetchError) throw fetchError;

    // 从存储中删除文件
    if (asset && (asset as any).storage_path) {
      await supabase.storage
        .from('character-assets')
        .remove([(asset as any).storage_path]);
    }

    // 从数据库中删除
    const { error: deleteError } = await supabase
      .from('assets')
      .delete()
      .eq('id', assetId);

    if (deleteError) throw deleteError;
  } catch (error) {
    console.error('删除资产错误:', error);
    throw error;
  }
}

// 保存用户创建的角色
export async function saveCharacter(characterState: CharacterState, name?: string): Promise<string> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('用户未登录');
    }

    const { data, error } = await supabase
      .from('characters')
      .insert({
        user_id: user.id,
        character_state: characterState,
        name: name || null
      } as any)
      .select('id')
      .single();

    if (error) throw error;
    return (data as any).id;
  } catch (error) {
    console.error('保存角色错误:', error);
    throw error;
  }
}

// 获取保存的角色
export async function getCharacter(characterId: string): Promise<CharacterState> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('用户未登录');
    }

    const { data, error } = await supabase
      .from('characters')
      .select('character_state')
      .eq('id', characterId)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    return (data as any).character_state as CharacterState;
  } catch (error) {
    console.error('获取角色错误:', error);
    throw error;
  }
}

// 获取用户的所有角色
export async function getUserCharacters(): Promise<Array<{ id: string; name: string | null; created_at: string }>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from('characters')
      .select('id, name, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Array<{ id: string; name: string | null; created_at: string }>;
  } catch (error) {
    console.error('获取角色列表错误:', error);
    return [];
  }
}
