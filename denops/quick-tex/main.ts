import { batch, Denops, fn, mapping, texUnicode, unknownutil } from "./deps.ts";

type ReplaceParams = {
  readonly trigger: string;
  readonly condition: string;
  readonly matcherString: string;
  readonly prepend: string;
  readonly append: string;
};
// deno-lint-ignore require-await
export async function main(denops: Denops): Promise<void> {
  const paramsForReplace = (params: ReplaceParams): string => {
    const strs = [
      params.trigger,
      params.condition,
      params.matcherString,
      params.prepend,
      params.append,
    ]
      .map((s) => JSON.stringify(s))
      .join(",");
    return `[${strs}]`;
  };
  denops.dispatcher = {
    async replace(
      trigger: unknown,
      condition: unknown,
      matcherString: unknown,
      prepend: unknown,
      append: unknown,
    ) {
      unknownutil.assert(trigger, unknownutil.isString);
      unknownutil.assert(condition, unknownutil.isString);
      unknownutil.assert(matcherString, unknownutil.isString);
      unknownutil.assert(prepend, unknownutil.isString);
      unknownutil.assert(append, unknownutil.isString);

      const line = await fn.getline(denops, ".");
      const charpos = await fn.getcharpos(denops, ".") as [
        number,
        number,
        number,
        number,
      ];
      const charCol0 = charpos[2] - 1;

      const matcher = new RegExp(matcherString);
      const target = line.slice(0, charCol0).match(matcher)?.[0] ?? "";
      const left = line.slice(0, charCol0 - target.length);
      const right = line.slice(charCol0);
      console.log({ line, charCol0, target, left, right });

      let targetReplaced = target + trigger;
      if (target.endsWith(condition)) {
        targetReplaced = prepend + texUnicode.runReplace(
          target.slice(
            0,
            target.length - condition.length,
          ),
          0,
        ).value +
          append;
      }
      const lineReplaced = `${left}${targetReplaced}${right}`;
      await fn.setline(denops, ".", lineReplaced);

      const newCharCol = charpos[2] - target.length + targetReplaced.length;
      await fn.setcharpos(denops, ".", [
        charpos[0],
        charpos[1],
        newCharCol,
        charpos[3],
      ]);
    },

    // pre-defined recipes
    async ["recipe:space"]() {
      const params = paramsForReplace({
        trigger: " ",
        condition: "",
        matcherString: "\\S*$",
        prepend: "",
        append: " ",
      });
      await mapping.map(
        denops,
        "<SPACE>",
        `<Cmd>call denops#notify("${denops.name}", "replace", ${params})<CR>`,
        {
          mode: "i",
          buffer: true,
        },
      );
    },
    async ["recipe:semisemi"]() {
      const params = paramsForReplace({
        trigger: ";",
        condition: ";",
        matcherString: ".*$",
        prepend: "",
        append: "",
      });
      await mapping.map(
        denops,
        ";",
        `<Cmd>call denops#notify("${denops.name}", "replace", ${params})<CR>`,
        {
          mode: "i",
          buffer: true,
        },
      );
    },
  };
}
