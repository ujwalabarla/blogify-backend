const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/blogify';
mongoose.connect(MONGODB_URI, { useNewUrlParser:true, useUnifiedTopology:true })
  .then(()=> console.log('MongoDB connected'))
  .catch((e)=> console.error('MongoDB connection error', e));

const UserSchema = new mongoose.Schema({name:String,email:{type:String,unique:true},password:String});
const CommentSchema = new mongoose.Schema({userId: mongoose.Types.ObjectId, name:String, text:String, createdAt:{type:Date, default:Date.now}});
const PostSchema = new mongoose.Schema({
  userId: mongoose.Types.ObjectId, title:String, content:String, imageUrl:String, createdAt:{type:Date, default:Date.now}, comments:[CommentSchema]
});

const User = mongoose.model('User', UserSchema);
const Post = mongoose.model('Post', PostSchema);

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

app.post('/api/auth/register', async (req,res)=>{
  try{
    const {name,email,password} = req.body;
    if(!email||!password) return res.status(400).json({error:'Missing fields'});
    const hashed = await bcrypt.hash(password,10);
    const user = await User.create({name,email,password:hashed});
    res.json({ok:true, userId:user._id});
  }catch(e){ res.status(500).json({error: e.message}); }
});

app.post('/api/auth/login', async (req,res)=>{
  const {email,password} = req.body;
  const user = await User.findOne({email});
  if(!user) return res.status(400).json({error:'Invalid credentials'});
  const matched = await bcrypt.compare(password, user.password);
  if(!matched) return res.status(400).json({error:'Invalid credentials'});
  const token = jwt.sign({userId:user._id, name:user.name}, JWT_SECRET, {expiresIn:'7d'});
  res.json({token, user:{id:user._id, name:user.name, email:user.email}});
});

function authMiddleware(req,res,next){
  const auth = req.headers.authorization;
  if(!auth) return res.status(401).json({error:'No token'});
  const token = auth.split(' ')[1];
  try{
    const data = jwt.verify(token, JWT_SECRET);
    req.user = data;
    next();
  }catch(e){ return res.status(401).json({error:'Invalid token'}); }
}

// Posts
app.get('/api/posts', async (req,res)=>{
  const posts = await Post.find().sort({createdAt:-1});
  res.json(posts);
});
app.post('/api/posts', authMiddleware, async (req,res)=>{
  const {title,content,imageUrl} = req.body;
  const post = await Post.create({userId:req.user.userId, title, content, imageUrl});
  res.json(post);
});
app.get('/api/posts/:id', async (req,res)=>{
  const p = await Post.findById(req.params.id);
  res.json(p);
});
app.post('/api/posts/:id/comments', authMiddleware, async (req,res)=>{
  const {text} = req.body;
  const post = await Post.findById(req.params.id);
  post.comments.push({userId:req.user.userId, name:req.user.name, text});
  await post.save();
  res.json(post);
});

// Optional: Cloudinary upload (server-side)
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

app.post('/api/upload', upload.single('image'), async (req,res)=>{
  try{
    if(!req.file) return res.status(400).json({error:'No file'});
    const buf = req.file.buffer;
    // upload buffer to Cloudinary
    const stream = cloudinary.uploader.upload_stream({folder:'blogify'}, (error, result)=>{
      if(error) return res.status(500).json({error});
      return res.json({url: result.secure_url});
    });
    stream.end(buf);
  }catch(e){ res.status(500).json({error:e.message}); }
});

app.listen(PORT, ()=> console.log('Blogify server running on', PORT));
