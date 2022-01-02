const Blog = require('../models/blog')

const initialBlogs = [
    {
        title: "Test Blog",
        author: "Chris Ellis",
        url: "www.test.com",
        likes: 100
    },
    {
        title: "Another Test Blog",
        author: "Donkey Kong",
        url: "www.dkc.com",
        likes: 12
    }
]

const nonExistingId = async () => {
    const blog = new Blog({ title: 'willremovethissoon', url: "doesntmatter" })
    await blog.save()
    await blog.remove()

    return blog._id.toString()
}

const blogsInDb = async () => {
    const blogs = await Blog.find({})
    return blogs.map(blog => blog.toJSON())
}

module.exports = {
    initialBlogs, nonExistingId, blogsInDb
}