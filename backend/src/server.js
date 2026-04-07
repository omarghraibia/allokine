/* global process */
import './config/loadEnv.js';
import app from './app.js';
const port = Number(process.env.PORT || 4000);

app.listen(port, () => {
    console.log(`AlloKine backend running on http://localhost:${port}`);
});
