import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { requestLogger } from './middlewares/requestLogger.middleware';
import { errorHandler } from './middlewares/error.middleware';
import { notFoundHandler } from './middlewares/notFound.middleware';
import routes from './routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(requestLogger);

app.use('/', routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
