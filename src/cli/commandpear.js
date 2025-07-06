export class CommandPear {
  _name = "";
  _description = "";
  _version = "";
  _commands = new Map();

  constructor() {}

  name(name) {
    this._name = name;
    return this;
  }

  description(description) {
    this._description = description;
    return this;
  }

  version(version) {
    this._version = version;
    return this;
  }

  command(command) {
    const commandInstance = new CommandPearCommand(command);
    this._commands.set(command, commandInstance);
    return commandInstance;
  }

  parse() {
    const args = Pear?.config?.args || process.argv.slice(2);
    const options = parseOptions(args);

    const commandArgs = options._.slice(1);
    const command = this._commands.get(options._[0]);

    if (!command) {
      console.error(chalk.red("Command not found"));
      return;
    }

    return command._run(commandArgs, options);
  }
}

export class CommandPearCommand {
  _command = "";
  _description = "";
  _action = null;

  constructor(command) {
    this._command = command;
  }

  description(description) {
    this._description = description;
    return this;
  }

  action(action) {
    this._action = action;
    return this;
  }

  _run(args, options) {
    return this._action(args, options);
  }
}

export function parseOptions(args = []) {
  const options = {};
  let i = 0;

  while (i < args.length) {
    const arg = args[i];

    // Check if it's a flag (starts with --)
    if (arg.startsWith("--")) {
      const flag = arg.slice(2); // Remove the --

      // Check if next argument is a value (not a flag)
      if (i + 1 < args.length && !args[i + 1].startsWith("--")) {
        options[flag] = args[i + 1];
        i += 2; // Skip both flag and value
      } else {
        // Boolean flag (no value)
        options[flag] = true;
        i += 1;
      }
    } else {
      // Positional argument
      if (!options._) options._ = [];
      options._.push(arg);
      i += 1;
    }
  }

  return options;
}

export function getOptions() {
  const args = Pear?.config?.args || process.argv.slice(2);
  return parseOptions(args);
}
