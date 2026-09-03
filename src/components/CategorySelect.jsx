import React, { useMemo } from 'react';
import { CATEGORIES, CATEGORY_LIST } from '@/lib/categories';
import { Label } from '@/components/ui/label';
import DropdownSelect from '@/components/DropdownSelect';

export default function CategorySelect({ category, subCategory, onCategoryChange, onSubCategoryChange, errors }) {
  const subCategories = useMemo(() => {
    return category && CATEGORIES[category] ? CATEGORIES[category] : [];
  }, [category]);

  const categoryOptions = CATEGORY_LIST.map(cat => ({ value: cat, label: cat }));
  const subCategoryOptions = subCategories.map(sub => ({ value: sub, label: sub }));

  const handleCategoryChange = (val) => {
    onCategoryChange(val);
    onSubCategoryChange('');
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label className="text-foreground font-medium">Category <span className="text-red-500">*</span></Label>
        <DropdownSelect
          value={category}
          onChange={handleCategoryChange}
          options={categoryOptions}
          placeholder="Select category"
          error={errors?.category}
        />
        {errors?.category && <p className="text-xs text-red-500">{errors.category}</p>}
      </div>

      <div className="space-y-2">
        <Label className="text-foreground font-medium">Sub Category <span className="text-red-500">*</span></Label>
        <DropdownSelect
          value={subCategory}
          onChange={onSubCategoryChange}
          options={subCategoryOptions}
          placeholder={category ? 'Select subcategory' : 'Select category first'}
          disabled={!category}
          error={errors?.subCategory}
        />
        {errors?.subCategory && <p className="text-xs text-red-500">{errors.subCategory}</p>}
      </div>
    </div>
  );
}