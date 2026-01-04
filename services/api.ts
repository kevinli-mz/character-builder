import { AppData, Asset, Category, CharacterState } from '../types';
import { supabase } from './supabase';

// 注意：getUserId 函数已移除，直接使用 await supabase.auth.getUser() 获取用户

// 从 Supabase 获取所有数据（分类和资产）- 全局共享，所有人都可以查看
export async function fetchData(): Promise<AppData> {
  try {
    // 添加超时控制
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Fetch timeout')), 8000);
    });

    // 获取分类（全局，所有人可查看）
    const categoriesPromise = supabase
      .from('categories')
      .select('*')
      .order('z_index', { ascending: true });

    const { data: categoriesData, error: categoriesError } = await Promise.race([
      categoriesPromise,
      timeoutPromise
    ]) as any;

    if (categoriesError) {
      console.warn('获取分类失败:', categoriesError);
      // 不抛出错误，返回空数组
    }

    // 获取资产（全局，所有人可查看）
    const assetsPromise = supabase
      .from('assets')
      .select('*');

    const { data: assetsData, error: assetsError } = await Promise.race([
      assetsPromise,
      timeoutPromise
    ]) as any;

    if (assetsError) {
      console.warn('获取资产失败:', assetsError);
      // 不抛出错误，继续使用空数组
    }

    // 转换为应用格式（即使数据为空也要处理）
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
    // 确保总是返回有效的数据结构
    return { categories: [], assets: [] };
  }
}

// 保存数据到 Supabase（仅管理员可用）
// 注意：此函数只进行 upsert，不会删除任何数据
// 如果需要删除，请使用专门的删除函数
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

    // 保存分类（只 upsert，不删除）
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

      if (error) {
        console.error('保存分类错误:', category.id, error);
        throw error;
      }
    }

    // 保存资产（只 upsert，不删除）
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

      if (error) {
        console.error('保存资产错误:', asset.id, error);
        throw error;
      }
    }

    return true;
  } catch (error) {
    console.error('保存数据错误:', error);
    throw error;
  }
}

// 更新单个分类（用于重命名、设置默认值等）
export async function updateCategory(categoryId: string, updates: { name?: string; z_index?: number; default_asset_id?: string | null }): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('用户未登录');
    }

    const { isAdmin } = await import('./admin');
    const adminStatus = await isAdmin();
    if (!adminStatus) {
      throw new Error('只有管理员可以编辑分类');
    }

    const { error } = await (supabase
      .from('categories')
      .update(updates as never)
      .eq('id', categoryId) as any);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('更新分类错误:', error);
    throw error;
  }
}

// 更新单个资产（用于重命名等）
export async function updateAsset(assetId: string, updates: { name?: string; category_id?: string }): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('用户未登录');
    }

    const { isAdmin } = await import('./admin');
    const adminStatus = await isAdmin();
    if (!adminStatus) {
      throw new Error('只有管理员可以编辑资产');
    }

    const { error } = await (supabase
      .from('assets')
      .update(updates as never)
      .eq('id', assetId) as any);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('更新资产错误:', error);
    throw error;
  }
}

// 删除分类（会同时删除该分类下的所有资产）
export async function deleteCategory(categoryId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('用户未登录');
    }

    const { isAdmin } = await import('./admin');
    const adminStatus = await isAdmin();
    if (!adminStatus) {
      throw new Error('只有管理员可以删除分类');
    }

    // 先删除该分类下的所有资产
    const { error: assetsError } = await supabase
      .from('assets')
      .delete()
      .eq('category_id', categoryId);

    if (assetsError) {
      console.error('删除分类资产错误:', assetsError);
      throw assetsError;
    }

    // 然后删除分类
    const { error: categoryError } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (categoryError) throw categoryError;
    return true;
  } catch (error) {
    console.error('删除分类错误:', error);
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

// 删除所有占位符资产（仅管理员可用）
// 占位符资产是指代码中定义的 DEFAULT_DATA 中的资产
export async function deleteStockAssets(): Promise<{ deleted: string[]; errors: string[] }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('用户未登录');
    }

    // 检查是否是管理员
    const { isAdmin } = await import('./admin');
    const adminStatus = await isAdmin();
    if (!adminStatus) {
      throw new Error('只有管理员可以删除占位符资产');
    }

    // 定义所有占位符资产的 ID（来自 DEFAULT_DATA）
    const stockAssetIds = new Set([
      'bg-1',      // Blue Sky
      'bg-2',      // Sunset
      'body-1',    // Standard Body
      'skin-1',    // Light
      'skin-2',    // Dark
      'face-1',    // Smile
      'hair-1',    // Spiky
      'hand-1',    // Waving
      'acc-1'      // Star Pin
    ]);

    // 获取所有资产
    const { data: allAssets, error: fetchError } = await supabase
      .from('assets')
      .select('id, public_url, storage_path');

    if (fetchError) throw fetchError;

    const deleted: string[] = [];
    const errors: string[] = [];

    // 识别并删除占位符资产
    // 占位符资产的特征：
    // 1. ID 在 stockAssetIds 列表中（明确的占位符 ID）
    // 2. 或者 public_url 是 data: URL（内联 base64 数据，不是上传的文件）
    // 注意：手动上传的资产会有 http/https URL（来自 Supabase Storage）
    for (const asset of (allAssets || [])) {
      const assetId = (asset as any).id;
      const publicUrl = (asset as any).public_url || '';
      const storagePath = (asset as any).storage_path || '';

      // 检查是否是占位符资产
      // 方法1: ID 在已知占位符列表中
      const isKnownStockId = stockAssetIds.has(assetId);
      
      // 方法2: public_url 是 data: URL（内联数据，不是上传的文件）
      // 手动上传的文件会有 http/https URL
      const isDataUrl = publicUrl.startsWith('data:image/');
      
      // 方法3: 检查 storage_path - 占位符资产通常没有有效的 storage_path
      // 或者 storage_path 是占位符路径（如 assets/bg-1）
      // 手动上传的文件会有完整的路径（如 assets/background/1234567890-abc123）
      const hasRealStoragePath = storagePath && 
                                 storagePath.includes('/') && 
                                 storagePath.split('/').length >= 3 && // 至少 3 层路径
                                 !stockAssetIds.has(assetId.split('-')[0]); // 不是占位符 ID 格式

      // 如果是已知占位符 ID 或者是 data URL，且没有真实的上传路径，则删除
      const isStockAsset = (isKnownStockId || isDataUrl) && !hasRealStoragePath;

      if (isStockAsset) {
        try {
          // 从数据库中删除
          const { error: deleteError } = await supabase
            .from('assets')
            .delete()
            .eq('id', assetId);

          if (deleteError) {
            errors.push(`${assetId}: ${deleteError.message}`);
          } else {
            deleted.push(assetId);
            console.log(`已删除占位符资产: ${assetId} (${(asset as any).name || 'unnamed'})`);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : '未知错误';
          errors.push(`${assetId}: ${errorMsg}`);
          console.error(`删除资产 ${assetId} 失败:`, error);
        }
      } else {
        // 记录跳过的资产（用于调试）
        console.log(`保留资产: ${assetId} (原因: ${hasRealStoragePath ? '有真实存储路径' : '不在占位符列表中'})`);
      }
    }

    // 清理分类中对已删除占位符资产的默认引用
    if (deleted.length > 0) {
      const { data: categories } = await supabase
        .from('categories')
        .select('id, default_asset_id');

      if (categories) {
        const deletedSet = new Set(deleted);
        for (const category of categories) {
          const defaultAssetId = (category as any).default_asset_id;
          if (defaultAssetId && deletedSet.has(defaultAssetId)) {
            // 清除默认资产引用
            await supabase
              .from('categories')
              .update({ default_asset_id: null } as never)
              .eq('id', (category as any).id);
            console.log(`已清除分类 ${(category as any).id} 的默认资产引用`);
          }
        }
      }
    }

    return { deleted, errors };
  } catch (error) {
    console.error('删除占位符资产错误:', error);
    throw error;
  }
}
