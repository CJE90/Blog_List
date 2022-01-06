const blogsRouter = require('express').Router()
const jwt = require('jsonwebtoken')
const Blog = require('../models/blog')
const User = require('../models/user')


blogsRouter.get('/', async (request, response) => {
    const blogs = await Blog.find({}).populate('user')
    response.json(blogs)
})

blogsRouter.get('/:id', async (request, response) => {
    const blog = await Blog.findById(request.params.id)
    if (blog) {
        response.json(blog)
    } else {
        response.status(404).end()
    }
})

blogsRouter.post('/', async (request, response, next) => {
    const body = request.body

    // const decodedToken = jwt.verify(request.token, process.env.SECRET)
    // if (!decodedToken.id) {
    //     return response.status(401).json({ error: 'token missing or invalid' })
    // }

    // const user = await User.findById(decodedToken.id)

    const user = request.user
    console.log(user)

    const blog = new Blog({
        title: body.title,
        author: body.author,
        url: body.url,
        likes: body.likes || 0,
        user: user._id
    })

    const savedBlog = await blog.save()

    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()
    response.json(savedBlog)
})

blogsRouter.put('/:id', (request, response, next) => {
    const body = request.body

    const blog = {
        title: body.title,
        author: body.author,
        url: body.url,
        likes: body.likes
    }
    Blog.findByIdAndUpdate(request.params.id, blog, { new: true })
        .then(updatedBlog => {
            response.json(updatedBlog)
        })
        .catch(error => next(error))
})

blogsRouter.delete('/:id', async (request, response) => {

    //const decodedToken = jwt.verify(request.token, process.env.SECRET)
    // if (!decodedToken.id) {
    //     return response.status(401).json({ error: 'token missing or invalid' })
    // }
    const user = request.user

    //we have the id of the blog
    //we have the id of the user
    //do we want to search the user for their blogs
    //or the blogs for their users?
    //onst user = await User.findById(decodedToken.id);
    const doesUserHaveBlog = await user.blogs.filter(blog => blog.toString() === request.params.id.toString())
    if (doesUserHaveBlog) {
        await Blog.findByIdAndRemove(request.params.id)
    } else {
        return response.status(401).json({ error: 'user not authorized to delete blog' })
    }

    response.status(204).end()
})

module.exports = blogsRouter