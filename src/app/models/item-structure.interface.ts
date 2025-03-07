export interface ItemStructure {
  name: string;
  level: number;
  values: ItemStructureItem[];
  parent?: ItemStructure;
}

export interface ItemStructureItem {
  name: string;
  parent?: ItemStructureItem;
}
