
export class FileNameParser {

    private _WILDCARD = "*";
    private _format: Array<string> = [];

    private _cards: Array<{ rule: string, key: string, b?: boolean, i?: number, j?: number }> = [
        { rule: "yyyy", key: "year"  },
        { rule: "MM", key: "month" },
        { rule: "dd", key: "day" },
        { rule: "hh", key: "hour" },
        { rule: "mm", key: "minute" },
        { rule: "ss", key: "second" },
        { rule: "n", key: "n" },
    ];
    private _wildNumber = 0;

    separator: RegExp;

    constructor(
        separators: string,
        public format: string,
    ) {
        this.separator = new RegExp(separators.split("").map(sep => `\\${sep}`).join("|"));
        this._format = format.split(this.separator);
        this._format.forEach((p, i) => {
            if (p.indexOf(this._WILDCARD) > -1) {
                this._cards.push({ rule: this._WILDCARD, key: "w" + this._wildNumber++, b: true, i });
                return;
            }
            this._cards.forEach(c => {
                if (p.indexOf(c.rule) > -1) {
                    c.b = true;
                    c.i = i;
                    c.j = p.indexOf(c.rule);
                }
            });
        });

        console.log(this._cards);
    }

    get length() {
        return this._format.filter(v => v !== this._WILDCARD).length;
    }

    parse(str: string, rule?: boolean): { [key: string]: string } {
        const words = str.split(this.separator);
        const result: { [key: string]: string } = { };

        this._cards.forEach(card => {
            if (!card.b) return;
            words.forEach((p, i) => {
                if (card.i === i) {
                    if (card.rule === this._WILDCARD) {
                        result[card.key] = p;
                    } else {
                        result[rule ? card.rule : card.key] = p.substring(card.j, card.rule.length + card.j);
                    }
                }
            });
        });

        return result;
    }
}