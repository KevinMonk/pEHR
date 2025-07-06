import tty from "bare-tty";
import process from "bare-process";

/**
 * Simple prompt class for handling interactive CLI prompts using bare-readline
 * Replaces inquirer dependency for Pear/Bare compatibility
 */
export class PearPrompt {
  constructor() {
    // Store the input stream for password input
    this.input = new tty.ReadStream(0);
    this.isWaitingForInput = false;
    this.currentResolve = null;
    this.currentBuffer = "";
  }

  /**
   * Ask a simple text input question
   * @param {string} message - The prompt message
   * @param {string} defaultValue - Optional default value
   * @returns {Promise<string>} - User's response
   */
  async ask(message, defaultValue = "") {
    return new Promise((resolve) => {
      const prompt = defaultValue
        ? `${message} (${defaultValue}): `
        : `${message}: `;

      process.stdout.write(prompt);

      // Use simple stdin approach
      process.stdin.once("data", (data) => {
        const answer = data.toString().trim();
        resolve(answer || defaultValue);
      });
    });
  }

  /**
   * Ask a yes/no question
   * @param {string} message - The prompt message
   * @param {boolean} defaultValue - Default value (true/false)
   * @returns {Promise<boolean>} - User's response
   */
  async confirm(message, defaultValue = true) {
    const defaultText = defaultValue ? "Y/n" : "y/N";
    const answer = await this.ask(`${message} (${defaultText})`);

    if (!answer) return defaultValue;

    const lowerAnswer = answer.toLowerCase();
    return lowerAnswer === "y" || lowerAnswer === "yes";
  }

  /**
   * Ask user to select from a list of choices
   * @param {string} message - The prompt message
   * @param {Array<{name: string, value: any}>} choices - Array of choice objects
   * @returns {Promise<any>} - Selected value
   */
  async select(message, choices) {
    console.log(`\n${message}:`);

    choices.forEach((choice, index) => {
      console.log(`  ${index + 1}. ${choice.name}`);
    });

    while (true) {
      const answer = await this.ask(`Select (1-${choices.length})`);
      const selection = parseInt(answer) - 1;

      if (selection >= 0 && selection < choices.length) {
        return choices[selection].value;
      }

      console.log(`Please enter a number between 1 and ${choices.length}`);
    }
  }

  /**
   * Ask for password input (hides typing)
   * @param {string} message - The prompt message
   * @returns {Promise<string>} - User's password
   */
  async password(message) {
    return new Promise((resolve) => {
      if (this.isWaitingForInput) {
        throw new Error("Already waiting for input");
      }

      this.isWaitingForInput = true;
      this.currentResolve = resolve;
      this.currentBuffer = "";

      const prompt = `${message}: `;
      process.stdout.write(prompt);

      // Set raw mode for direct input handling and disable echo
      this.input.setMode(tty.constants.MODE_RAW);
      this.input.setRawMode(true);

      // Set up data listener for password (hides input)
      this.input.on("data", this.handlePasswordInput.bind(this));
    });
  }

  /**
   * Handle password input (hides characters)
   * @param {Buffer} data - Raw input data
   */
  handlePasswordInput(data) {
    const char = data.toString();

    if (char === "\r" || char === "\n") {
      // Enter pressed - finish input
      this.finishPasswordInput();
    } else if (data[0] === 3) {
      // Ctrl+C
      this.input.removeListener("data", this.handlePasswordInput.bind(this));
      this.input.setMode(tty.constants.MODE_NORMAL);
      this.input.setRawMode(false);
      process.exit(1);
    } else if (data[0] === 127) {
      // Backspace
      if (this.currentBuffer.length > 0) {
        this.currentBuffer = this.currentBuffer.slice(0, -1);
        process.stdout.write("\b \b");
      }
    } else if (data[0] >= 32) {
      // Printable character (hide with *)
      this.currentBuffer += char;
      process.stdout.write("*");
    }
  }

  /**
   * Finish password input
   */
  finishPasswordInput() {
    if (!this.isWaitingForInput) return;

    this.isWaitingForInput = false;
    this.input.removeListener("data", this.handlePasswordInput.bind(this));
    this.input.setMode(tty.constants.MODE_NORMAL);
    this.input.setRawMode(false);
    process.stdout.write("\n");

    const answer = this.currentBuffer;
    this.currentBuffer = "";

    if (this.currentResolve) {
      this.currentResolve(answer);
      this.currentResolve = null;
    }
  }

  /**
   * Ask multiple questions in sequence
   * @param {Array<Object>} questions - Array of question objects
   * @returns {Promise<Object>} - Object with answers keyed by question names
   */
  async prompt(questions) {
    const answers = {};

    for (const question of questions) {
      let answer;

      switch (question.type) {
        case "input":
          answer = await this.ask(question.message, question.default);
          if (question.validate) {
            const validation = question.validate(answer);
            if (validation !== true) {
              console.log(`Error: ${validation}`);
              // Re-ask the same question
              const index = questions.indexOf(question);
              questions.splice(index, 0, question);
              continue;
            }
          }
          break;

        case "confirm":
          answer = await this.confirm(question.message, question.default);
          break;

        case "list":
          answer = await this.select(question.message, question.choices);
          break;

        case "password":
          answer = await this.password(question.message);
          break;

        default:
          throw new Error(`Unsupported question type: ${question.type}`);
      }

      answers[question.name] = answer;
    }

    return answers;
  }

  /**
   * Close the input stream
   */
  close() {
    if (this.input) {
      this.input.destroy();
    }
  }
}

/**
 * Create a single prompt instance for the application
 */
export const pearprompt = new PearPrompt();

// Cleanup on process exit
process.on("exit", () => {
  pearprompt.close();
});

process.on("SIGINT", () => {
  pearprompt.close();
  process.exit(0);
});
