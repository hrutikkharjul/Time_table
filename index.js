import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import { sign } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(__filename);
const app = express();
const port = 3000;

app.set('views', path.join(dirname, 'views'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(dirname,'public\\index.html'));
});

app.post('/TTSubmit', (req, res) => {
  const {evenodd, classnm, lecpr} = req.body;
  res.render(path.join(dirname, 'public\\page2'), {evenodd: evenodd, classnm: classnm, lecpr: lecpr});
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});