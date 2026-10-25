export interface IBaseRepository<T> {
  findById(id: string): Promise<T | null>;
  findMany(filter?: any): Promise<T[]>;
  create(data: any): Promise<T>;
  update(id: string, data: any): Promise<T | null>;
  delete(id: string): Promise<T | null>;
  count(filter?: any): Promise<number>;
}
