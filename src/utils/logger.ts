import chalk from 'chalk';

export const logger = {
  info: (message: string) => {
    console.log(chalk.blue('ℹ'), message);
  },
  
  success: (message: string) => {
    console.log(chalk.green('✓'), message);
  },
  
  warn: (message: string) => {
    console.log(chalk.yellow('⚠'), message);
  },
  
  error: (message: string) => {
    console.error(chalk.red('✗'), message);
  },
  
  debug: (message: string) => {
    if (process.env.DEBUG) {
      console.log(chalk.gray('[DEBUG]'), message);
    }
  }
};