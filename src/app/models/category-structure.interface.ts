import { NewCategory, NewCategoryItem } from './new-category.interface';

export interface CategoryStructure extends NewCategory {
  values: NewCategoryItem[];
  selectedItem?: string;
}
