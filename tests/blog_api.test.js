const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app);

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

beforeEach(async () => {
    await Blog.deleteMany({})
    let blogObject = new Blog(initialBlogs[0])
    await blogObject.save()
    blogObject = new Blog(initialBlogs[1])
    await blogObject.save()
})

test('Blogs returned as JSON', async () => {
    await api
        .get('/api/blogs')
        .expect(200)
        .expect('Content-Type', /application\/json/)
})

test('All blog entries are returned', async () => {
    const response = await api.get('/api/blogs')
    expect(response.body).toHaveLength(initialBlogs.length);
})
test('a specific blog is returned within the returned blogs', async () => {
    const response = await api.get('/api/blogs')
    const titles = response.body.map(blog => blog.title)
    expect(titles).toContain('Test Blog')
})

afterAll(() => {
    mongoose.connection.close()
})