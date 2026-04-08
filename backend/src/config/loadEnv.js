import dotenv from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const candidateEnvPaths = [
    resolve(currentDir, '../../../.env'),
    resolve(currentDir, '../../.env')
];

let envPath = candidateEnvPaths[0];

for (const candidate of candidateEnvPaths) {
    const result = dotenv.config({ path: candidate, override: false });
    if (!result.error) {
        envPath = candidate;
        break;
    }
}

export { envPath };
