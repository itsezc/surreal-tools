import { Model, SQL, TModelProperties } from './';

type TSurrealEventAccessors<SubModel extends Model> = {
	$after: TModelProperties<SubModel>;
	$before: TModelProperties<SubModel>;
};

export type TSurrealEventProps<SubModel extends Model> = {
	name: string;
	when: (cb: TSurrealEventAccessors<SubModel>) => (keyof SubModel)[];
	then: (cb: TSurrealEventAccessors<SubModel>) => string;
};

export class SurrealEvent<SubModel extends Model> {
	constructor(
		public props: TSurrealEventProps<SubModel>,
		protected table?: SubModel,
	) {}
}

export class SurrealEventManager<SubModel extends Model> {
	private modelled_events: SurrealEvent<SubModel>[];

	constructor(from: SubModel, events: TSurrealEventProps<SubModel>[]) {
		this.modelled_events = events.map((e) => {
			return new SurrealEvent(e, from);
		});
	}
}
