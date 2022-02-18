import colors from "kleur";
// @ts-expect-error -- no type declaration exists
import cClear from "console-clear";
// @ts-expect-error -- no type declaration exists
import format from "webpack-format-messages";
import webpack from "webpack";

const NAME = "webpack-messages";
const log = (str: string) => console.log(str);
const clear = () => (cClear(true), true);

type Options = {
	name: string;
	onComplete?: (...args: unknown[]) => void;
	logger?: (msg: string) => void;
};

class WebpackMessages implements webpack.WebpackPluginInstance {
	name: string;
	logger: (msg: string) => void;
	onDone?: (...args: unknown[]) => void;

	constructor(opts: Options) {
		this.name = opts?.name;
		this.onDone = opts?.onComplete;
		this.logger = opts?.logger ?? log;
	}

	printError(str: string, arr: string[]) {
		arr && (str += "\n\n" + arr.join(""));
		clear() && this.logger(str);
	}

	apply(compiler: webpack.Compiler) {
		const name = this.name ? ` ${colors.cyan(this.name)} bundle` : "";
		const onStart = () => this.logger(`Building${name}...`);

		const onComplete = (stats: webpack.Stats) => {
			const messages = format(stats);

			if (messages.errors.length) {
				return this.printError(
					colors.red(`Failed to compile${name}!`),
					messages.errors
				);
			}

			if (messages.warnings.length) {
				return this.printError(
					colors.yellow(`Compiled${name} with warnings.`),
					messages.warnings
				);
			}

			if (this.onDone !== undefined) {
				this.onDone(name, stats);
			} else {
				const sec = (stats.endTime - stats.startTime) / 1e3;
				this.logger(colors.green(`Completed${name} in ${sec}s!`));
			}
		};

		compiler.hooks.compile.tap(NAME, onStart);
		compiler.hooks.invalid.tap(NAME, () => clear() && onStart());
		compiler.hooks.done.tap(NAME, onComplete);
	}
}

module.exports = WebpackMessages;
