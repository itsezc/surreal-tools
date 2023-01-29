import { DateTime, Field, Model, Table, count, SArray, GeoPoint } from '@surreal-tools/orm';

import { Account } from './account';
import { IssueLabel } from './issue_label';
import { Project } from './project';

import { AccountScope, AdminScope } from './scopes';


@Table<Issue>({
	permissions: ({ id, title, labels }, { $auth }) => ({
		create: AccountScope && count(SArray.intersect(labels, ['admin', 'manager'])) > 0,
		delete: 'id == $auth.id',
		update: AdminScope || (AccountScope && id === $auth.id || AdminScope && id === $auth.id),
		select: AdminScope || (id == $auth.id && title != null && (AdminScope) && AccountScope)
	}),
})
export class Issue extends Model {
	@Field({ index: true })
	title: string = 'New issue';

	body!: string;

	priority!: 'no_priority' | 'urgent' | 'high' | 'medium' | 'low';

	status: 'backlog' | 'todo' | 'in_progress' | 'done' | 'canceled' = 'backlog';

	due?: DateTime;

	labels?: IssueLabel[];

	project?: Project;

	parent?: Issue;

	assignee?: Account;

	creator?: Account;

	tags?: string[];

	points?: GeoPoint[];
}