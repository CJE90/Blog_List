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

test('Verify unique identifier property is "id"', async () => {
    const response = await api.get('/api/blogs')
    expect(response.body[0].id).toBeDefined();
})

describe('Blog posting function', () => {
    const blogEntryToPost = {
        title: "Posting from test suite",
        author: "Computer Overlords",
        url: "www.no.com",
        likes: 2
    }
    const blogEntryToPostWithNoLikes = {
        title: "Posting from test suite",
        author: "Computer Overlords",
        url: "www.no.com"
    }

    const blogWithoutRequiredFields = {
        author: "no one",
        likes: 0
    }

    test('A valid blog post can be added', async () => {
        await api
            .post('/api/blogs')
            .send(blogEntryToPost)
            .expect(200)
            .expect('Content-Type', /application\/json/)

        const response = await api.get('/api/blogs')

        const titles = response.body.map(blogs => blogs.title)

        expect(response.body).toHaveLength(initialBlogs.length + 1)
        expect(titles).toContain('Posting from test suite')
    })

    test('Likes will be set to 0 when positing blog with no likes', async () => {
        await api
            .post('/api/blogs')
            .send(blogEntryToPostWithNoLikes)
            .expect(200)
            .expect('Content-Type', /application\/json/)

        const response = await api.get('/api/blogs')
        const likes = response.body.map(blog => blog.likes)
        console.log(likes)
        expect(likes[likes.length - 1]).toEqual(0)
    })

    test('Post without required fields will return 400', async () => {
        await api
            .post('/api/blogs')
            .send(blogWithoutRequiredFields)
            .expect(400)

    })
})

afterAll(() => {
    mongoose.connection.close()
})