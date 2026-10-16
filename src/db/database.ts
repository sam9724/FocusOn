import Dexie, { type EntityTable } from "dexie";
import { dataSchema, initialData, type Data } from "../lib/model";
export class FocusDatabase extends Dexie {
  snapshots!: EntityTable<{ id: string; data: Data }, "id">;
  constructor(name = "one-thing-focus") {
    super(name);
    this.version(1).stores({ snapshots: "id" });
  }
  async load(): Promise<Data> {
    const row = await this.snapshots.get("main");
    return row ? dataSchema.parse(row.data) : initialData();
  }
  async save(data: Data): Promise<void> {
    await this.snapshots.put({ id: "main", data: dataSchema.parse(data) });
  }
}
export const database = new FocusDatabase();
