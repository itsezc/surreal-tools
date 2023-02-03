import { Lucid } from './';
import { SurrealEventManager, TSurrealEventProps } from './event';
import { SelectBuilder, TSelectExpression, UpdateBuilder, DeleteBuilder } from './builders';

import type { ITable } from './table';
import { stringifyToSQL, toSnakeCase } from './util';
import { SubsetModel, PartialId, BasicRecordProps } from './builders/select_builder';

export interface IModel {
	id: string;
	__tableName(original?: boolean): string;
}

export class Model implements IModel {
	protected schemafull = true;
	protected edge = false;

	public id!: string;

	constructor(props?: ITable<Model>) {
		const tableMeta = Lucid.tableMetadata.get(this.constructor.name);
		if (tableMeta) {
			this.edge = props?.edge ?? Lucid.tableMetadata.get(this.constructor.name)?.edge ?? false;
		}
	}

	public __tableName(original = false) {
		return original ? this.constructor.name : toSnakeCase(Lucid.tableMetadata.get(this.constructor.name).name || this.constructor.name);
	}

	public static select<SubModel extends IModel, T extends keyof SubsetModel<SubModel>>(
		this: { new (props?: ITable<Model>): SubModel },
		fields: TSelectExpression<SubModel, T, null> = '*',
	) {
		return new SelectBuilder<SubModel, Pick<SubModel, T>>({ model: new this({ edge: true }) }).select(fields);
	}

	public static update<SubModel extends Model>(this: { new (props?: ITable<Model>): SubModel }, from?: string) {
		return new UpdateBuilder<SubModel>({ model: new this() }).from(from);
	}

	public static delete<SubModel extends Model>(this: { new (props?: ITable<Model>): SubModel }, from?: string) {
		return new DeleteBuilder<SubModel>({ model: new this() }).from(from);
	}

	public static events<SubModel extends Model>(this: { new (props?: ITable<Model>): SubModel }, args: TSurrealEventProps<SubModel>[]) {
		const model = new this();

		return new SurrealEventManager(model, args);
	}

	public static async create<SubModel extends Model>(this: { new (props?: ITable<Model>): SubModel }, props: PartialId<SubModel>): Promise<SubModel> {
		const model = new this();
		Object.assign(model, props);
		return await model.save();
	}

	public static async createMany<SubModel extends Model>(this: { new (props?: ITable<Model>): SubModel }, props: PartialId<SubModel>[]): Promise<SubModel[]> {
		const staticModel = this as unknown as typeof Model;
		return await Promise.all(props.map((prop) => staticModel.create(prop)) as Promise<SubModel>[]);
	}

	#transformModel(row: this & { schemafull?: boolean; edge?: boolean }) {
		// check for nested models, if found, transform them to their id
		Object.keys(row).forEach((key) => {
			if (row[key] instanceof Model) {
				if (!row[key].id) return;
				row[key] = row[key].id;
			}
			// recursively transform nested models
			if (row[key] instanceof Array) {
				row[key] = row[key].map((item) => this.#transformModel(item));
			}
			if (typeof row[key] === 'object') {
				row[key] = this.#transformModel(row[key]);
			}
		});
		return row;
	}

	public async save<SubModel extends Model>(): Promise<SubModel> {
		let row = {
			...this,
			schemafull: undefined,
			edge: undefined,
		};

		// rome-ignore lint/performance/noDelete: Surreal expects empty properties not undefined
		Object.keys(row).forEach((key) => row[key] === undefined && delete row[key]);
		row = this.#transformModel(row);
		if (this.id) {
			// @ts-ignore
			this.constructor.update(`${this.__tableName()}:${this.id}`).merge(row).execute();
		} else {
			let query = `CREATE ${this.__tableName()}`;
			query = query.concat(' CONTENT ', stringifyToSQL(row), ';');
			const response = await Lucid.client().query<SubModel[]>(query);
			//todo: handle errors in a more elegant way

			if (response.length === 0) {
				throw new Error('No response from server');
			}

			if (response[0].status !== 'OK') {
				throw new Error(response[0].status);
			}

			Object.assign(this, response[0].result[0]);
		}

		return this as unknown as SubModel;
	}
}
