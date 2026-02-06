-- 为 presets.mask_shape 增加 'rounded_rect' 选项（保留 'diamond' 以兼容旧数据）
-- 若已存在 CHECK 约束，需先删除再添加。约束名可能为 presets_mask_shape_check。

ALTER TABLE presets DROP CONSTRAINT IF EXISTS presets_mask_shape_check;
ALTER TABLE presets ADD CONSTRAINT presets_mask_shape_check
  CHECK (mask_shape IN ('square', 'circle', 'diamond', 'rounded_rect'));
