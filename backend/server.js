import express from 'express';
const app = express();
const PORT = 3000;
var count=0;
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/ping',(req,res)=>{
    count=count+1
    res.send(count)
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
