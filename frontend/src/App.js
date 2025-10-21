import React, {useState, useEffect} from 'react';
import axios from 'axios';
const API = process.env.REACT_APP_API || 'http://localhost:5000';

function App(){
  const [token,setToken]=useState(localStorage.getItem('bf_token')||'');
  const [user,setUser]=useState(JSON.parse(localStorage.getItem('bf_user')||'null'));
  const [posts,setPosts]=useState([]);
  const [form,setForm]=useState({name:'',email:'',password:''});
  const [postForm,setPostForm]=useState({title:'',content:'',image:null,imageUrl:''});
  const [commentText,setCommentText]=useState('');

  useEffect(()=>{ fetchPosts(); },[]);

  async function fetchPosts(){ const res = await axios.get(API+'/api/posts'); setPosts(res.data); }
  async function register(){ await axios.post(API+'/api/auth/register', {name:form.name,email:form.email,password:form.password}); alert('Registered - login now'); }
  async function login(){ const res = await axios.post(API+'/api/auth/login', {email:form.email,password:form.password}); setToken(res.data.token); setUser(res.data.user); localStorage.setItem('bf_token', res.data.token); localStorage.setItem('bf_user', JSON.stringify(res.data.user)); }
  function logout(){ setToken(''); setUser(null); localStorage.removeItem('bf_token'); localStorage.removeItem('bf_user'); }

  async function uploadImage(file){
    const fd = new FormData();
    fd.append('image', file);
    const res = await axios.post(API+'/api/upload', fd);
    return res.data.url;
  }

  async function createPost(){
    let imgUrl = postForm.imageUrl;
    if(postForm.image){ imgUrl = await uploadImage(postForm.image); }
    await axios.post(API+'/api/posts', {title:postForm.title, content:postForm.content, imageUrl:imgUrl}, {headers:{Authorization:'Bearer '+token}});
    setPostForm({title:'',content:'',image:null,imageUrl:''});
    fetchPosts();
  }

  async function addComment(postId){
    if(!commentText) return;
    await axios.post(API+`/api/posts/${postId}/comments`, {text:commentText}, {headers:{Authorization:'Bearer '+token}});
    setCommentText('');
    fetchPosts();
  }

  if(!token){
    return <div className="container"><div className="header"><h2>Blogify</h2></div>
      <h3>Login / Register</h3>
      <input placeholder="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/>
      <input placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})}/>
      <input placeholder="Password" type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})}/>
      <div><button onClick={register}>Register</button><button onClick={login} style={{marginLeft:8}}>Login</button></div>
    </div>;
  }

  return <div className="container">
    <div className="header"><h2>Blogify</h2><div><span className="small">Signed in as {user?.name}</span> <button onClick={logout} style={{marginLeft:8}}>Logout</button></div></div>

    <div style={{marginTop:12}}>
      <h3>Create Post</h3>
      <input placeholder="Title" value={postForm.title} onChange={e=>setPostForm({...postForm,title:e.target.value})}/>
      <textarea placeholder="Content" value={postForm.content} onChange={e=>setPostForm({...postForm,content:e.target.value})}></textarea>
      <input type="file" onChange={e=>setPostForm({...postForm, image: e.target.files[0]})}/>
      <div><button onClick={createPost}>Publish</button></div>
    </div>

    <div style={{marginTop:20}}>
      <h3>Posts</h3>
      {posts.map(p=> <div className="post" key={p._id}><h4>{p.title}</h4><div className="small">by {p.userId? 'Author' : 'Unknown'} — {new Date(p.createdAt).toLocaleString()}</div>
        {p.imageUrl && <img src={p.imageUrl} alt="" style={{maxWidth:300,display:'block',marginTop:8}}/>}
        <p>{p.content}</p>
        <div><h5>Comments</h5>
          {p.comments && p.comments.length? p.comments.map(c=> <div key={c._id} className="comment"><b>{c.name}</b> <span className="small"> — {new Date(c.createdAt).toLocaleString()}</span><div>{c.text}</div></div>) : <div className="small">No comments</div>}
          <div style={{marginTop:8}}>
            <input placeholder="Write a comment" value={commentText} onChange={e=>setCommentText(e.target.value)}/>
            <button onClick={()=>addComment(p._id)} style={{marginTop:6}}>Add Comment</button>
          </div>
        </div>
      </div>)}
    </div>
  </div>;
}

export default App;
