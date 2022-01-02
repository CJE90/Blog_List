const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app);

const Blog = require('../models/blog')

beforeEach(async () => {
    // await Blog.deleteMany({})
    // let blogObject = new Blog(helper.initialBlogs[0])
    // await blogObject.save()
    // blogObject = new Blog(helper.initialBlogs[1])
    // await blogObject.save()

    await Blog.deleteMany()
    const blogObjects = helper.initialBlogs
        .map(blog => new Blog(blog))
    const promiseArray = blogObjects.map(blog => blog.save())
    await Promise.all(promiseArray)
})

test('Blogs returned as JSON', async () => {
    await api
        .get('/api/blogs')
        .expect(200)
        .expect('Content-Type', /application\/json/)
})

test('All blog entries are returned', async () => {
    const blogsInDb = await helper.blogsInDb()
    expect(blogsInDb).toHaveLength(helper.initialBlogs.length);
})
test('a specific blog is returned within the returned blogs', async () => {
    const blogsInDb = await helper.blogsInDb()
    const titles = blogsInDb.map(blog => blog.title)
    expect(titles).toContain('Test Blog')
})

test('Verify unique identifier property is "id"', async () => {
    const blogsInDb = await helper.blogsInDb()
    expect(blogsInDb[0].id).toBeDefined();
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

        const blogsInDb = await helper.blogsInDb()

        const titles = blogsInDb.map(blogs => blogs.title)

        expect(blogsInDb).toHaveLength(helper.initialBlogs.length + 1)
        expect(titles).toContain('Posting from test suite')
    })

    test('Likes will be set to 0 when positing blog with no likes', async () => {
        await api
            .post('/api/blogs')
            .send(blogEntryToPostWithNoLikes)
            .expect(200)
            .expect('Content-Type', /application\/json/)

        const blogsInDb = await helper.blogsInDb()
        const likes = blogsInDb.map(blog => blog.likes)
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