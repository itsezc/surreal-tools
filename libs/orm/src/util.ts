export function toSnakeCase(name: string): string {
	let newName = '';
	for (let i = 0; i < name.length; i++) {
		if (name[i] === name[i].toUpperCase()) {
			if (i === 0) {
				newName += name[i].toLowerCase();
			} else {
				newName += `${name.includes('_') ?name[i].toLowerCase() : `_${name[i].toLowerCase()}`}`;
			}
		} else {
			newName += name[i];
		}
	}
	return newName;
}

export function joinRangeFields(arr?: string[][] | number[]) {
	if (!arr) return '';

	if (arr[0] instanceof Array) {
		let res = `['${arr[0].join("', '")}']`;
		for (let i = 1; i < arr.length; i++) {
			res += `..['${(arr[i] as string[]).join("', '")}']`;
		}
		return res;
	} else {
		const seperator = '..';
		let res = '';
		for (let i = arr.length; i--; ) res = (i ? seperator : '') + arr[i] + res;
		return res;
	}
}

export function escapeString(text?: string): string | void {
	if (text) {
		return text.replaceAll('\'', '').replaceAll('"', '');
	}

	return;
}