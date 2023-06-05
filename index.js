import fs from 'fs';
import readline from 'readline';
import { States, Finals } from './table.js';

const inputFile = 'input.txt';
const outputFile = 'log.txt';
const errorFile = 'errorlog.txt';

// Create a readable stream to read the input file line by line
const readStream = fs.createReadStream(inputFile, 'utf8');

// Create a writable stream to write the results to the output file
const writeStream = fs.createWriteStream(outputFile, 'utf8');

// Create a writable stream to write the results to the error file
const errorStream = fs.createWriteStream(errorFile, 'utf8');

// Create an interface to read lines from the input stream
const rl = readline.createInterface({
    input: readStream,
    crlfDelay: Infinity
});

// Process each line of the input file
let lineCount = 0;
let curr = '';
let state = 0;
let carry = false;
const rsl = [];

const analyzeChar = (char, position) => {
    const currState = States[state];
    let matched = false;
    if (currState.moves) {
        for (const key in currState.moves) {
            const compare = RegExp(key);
            console.log('Comparison -> ', compare, ' to: <', char, '>');
            console.log('current token -> ', curr);
            const match = char.match(compare);
            console.log('Matched? -> ', match);
            if (match) {
                if (currState.will === 'carry') {
                    carry = true;
                }
                state = currState.moves[key];
                matched = true;
                curr = curr + char;
                break;
            }
        }
    } else if (currState.will === 'end') {
        rsl.push({ type: Finals[state], value: curr });
        carry = false;
        matched = true;
        console.log('   final -> ', curr);
        state = 0;
        curr = '';
        return true;
    }
    if (!matched) {
        if (currState.will === 'end') {
            if (currState.predates) {
                if (Finals[currState.predates] === rsl[rsl.length - 1].type) {
                    rsl.pop();
                }
            }
            rsl.push({ type: Finals[state], value: curr });
            carry = false;
            matched = true;
            console.log('--> final -> ', curr);
            state = 0;
            curr = '';
            return true;
        } else {
            throw new Error(`Invalid character: ${char}, at position ${position}`);
        }
    }
};

rl.on('line', (line) => {
    try {
        const chars = line.split('');
        console.log(chars, chars.length);
        for (let index = 0; index <= chars.length; index++) {
            let char;
            if (index < chars.length) {
                char = chars[index];
            } else {
                char = ' ';
            }
            const pos = index + 1;
            console.log('   State -> ', state, ' - Pos -> ', index);
            const n = analyzeChar(char, pos);
            if (n) {
                index--;
            }
        }
        lineCount++;
    } catch (error) {
        lineCount++;

        // Write the correct tokens to the output file
        if (rsl) {
            const outputData = rsl.map((token) => `${token.type}: ${token.value}`).join('\n');
            writeStream.write(outputData + '\n');
        }

        // Write the error to the error file
        const errorMessage = `Error on line ${lineCount} -> ${error}`;
        errorStream.write(errorMessage);
        console.error(errorMessage);

        // Clear the rsl array
        rsl.length = 0;
    }
});

// Close the write stream when all lines have been processed
rl.on('close', () => {
    // Write the final results to the output file
    const outputData = rsl.map((token) => `${token.type}: ${token.value}`).join('\n');
    writeStream.write(outputData + '\n');

    // Close the write stream
    writeStream.end();
    errorStream.end();

    console.log('Finished');
});



// Close the write stream when all lines have been processed
rl.on('close', () => {
    if (carry) {
        console.error('Error on line ' + lineCount + ' -> ' + curr + ' was not closed');
        errorStream.write('Error on line ' + lineCount + ' -> ' + curr + ' was not closed');
    }
    console.log(rsl);
    console.log('Finished');
    writeStream.end();
    errorStream.end();
});