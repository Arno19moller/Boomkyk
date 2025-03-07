export interface ItemStructure {
  name: string;
  level: number;
  values: ItemStructureItem[];
  parent?: ItemStructure;
  selectedItem?: string; // used in filter
}

export interface ItemStructureItem {
  name: string;
  parent?: ItemStructureItem;
}
