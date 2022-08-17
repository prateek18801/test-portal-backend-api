if (process.env.NODE_ENV === 'dev') require('dotenv').config();

const cluster = require('node:cluster');
const os = require('node:os');
const express = require('express');

require('./api/utils/db').connect();
const userRoutes = require('./api/routes/user');
const adminRoutes = require('./api/routes/admin');
const errorHandler = require('./api/middlewares/error');

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use('/api', userRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);

if (cluster.isPrimary) {
    console.log(`master ${process.pid} starting cluster`);

    for (let i = 0; i < os.cpus().length; i++) { cluster.fork(); }

    cluster.on('exit', (worker, code, signal) => {
        if (signal) {
            console.log(`worker ${worker.process.pid} killed signal: ${signal}`);
        } else if (code !== 0) {
            console.log(`worker ${worker.process.pid} exited code: ${code}`);
        } else {
            console.log(`worker ${worker.process.pid} died`);
        }
        cluster.fork();
    });
} else {
    app.listen(process.env.PORT, process.env.HOST, () => {
        console.log(`worker running on ${process.env.HOST}:${process.env.PORT} - pid: ${process.pid}`);
    });
}