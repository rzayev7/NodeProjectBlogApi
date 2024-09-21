const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
require('../utils/middleware')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
  response.json(blogs)
})
  
blogsRouter.post('/', async(request, response) => {
  const body = request.body
  const user = request.user
  const token = request.token
  if(!(token && user)){
    return response.status(401).json({ error: 'token invalid' })
  }
  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes || 0,
    user: user._id
  })
  if(blog.url && blog.title){
    const savedBlog = await blog.save()
    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()
    const populatedBlog = await Blog.findById(savedBlog._id).populate('user', { username: 1, name: 1 })
    response.status(201).json(populatedBlog)
  }else{
    response.status(400).end()  
  }
})

blogsRouter.get('/:id', async (request, response, next) => {
  const blog = await Blog.findById(request.params.id)
  if(blog){
    response.json(blog)
  }else{
    response.status(404).end()
    }
})

blogsRouter.delete('/:id', async (request, response, next) => {
  const user = request.user
  const token = request.token
  if(!(token && user)){
    return response.status(401).json({ error: 'token invalid' })
  }
  const blog = await Blog.findById(request.params.id)
  if(blog.user.toString() === user.id.toString()){
    await Blog.findByIdAndRemove(request.params.id)
    response.status(204).end()
  }else{
    response.status(401).json({ error: 'lack of valid authentication credentials' })
  }
})


blogsRouter.delete('/', async (request, response, next) => {
  await Blog.deleteMany({})
  response.status(204).end()
})

blogsRouter.put('/:id', async(request, response, next) => {
  try{
    const body = request.body
    const updatedBlog = {
      title: body.title,
      author: body.author,
      url: body.url,
      likes: body.likes || 0,
      user: body.user.id
    }
    if(updatedBlog.url && updatedBlog.title){
      const blog = await Blog.findByIdAndUpdate(request.params.id, updatedBlog, { new: true }).populate('user', { username: 1, name: 1 })
      response.status(200).json(blog)
    }else{
      response.status(400).end()
    }
  }catch(exception){
    next(exception)
  }
})

module.exports = blogsRouter