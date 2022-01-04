const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const bcrypt = require('bcrypt')
const app = require('../app')
const api = supertest(app);

const Blog = require('../models/blog')
const User = require('../models/user')

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

test('succeeds with a valid id', async () => {
    const blogsAtStart = await helper.blogsInDb()

    const blogToView = blogsAtStart[0]

    const resultBlog = await api
        .get(`/api/blogs/${blogToView.id}`)
        .expect(200)
        .expect('Content-Type', /application\/json/)

    const processedBlogToView = JSON.parse(JSON.stringify(blogToView))

    expect(resultBlog.body).toEqual(processedBlogToView)
})

test('update succeeds with a valid id', async () => {
    const blogsAtStart = await helper.blogsInDb()

    const blogToView = blogsAtStart[0];
    blogToView.title = 'Testing with jest'

    await api
        .put(`/api/blogs/${blogToView.id}`)
        .send(blogToView)
        .expect(200)
        .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()
    const updatedBlogToView = blogsAtEnd[0]

    expect(blogToView.title).toEqual(updatedBlogToView.title)
})

describe('deletion of a blog', () => {
    test('succeeds with status code 204 if id is valid', async () => {
        const blogsAtStart = await helper.blogsInDb()
        const blogToDelete = blogsAtStart[0]

        await api
            .delete(`/api/blogs/${blogToDelete.id}`)
            .expect(204)

        const blogsAtEnd = await helper.blogsInDb()

        expect(blogsAtEnd).toHaveLength(
            helper.initialBlogs.length - 1
        )

        const titles = blogsAtEnd.map(r => r.title)

        expect(titles).not.toContain(blogToDelete.title)
    })
})

describe('when there is initially one user in db', () => {
    beforeEach(async () => {
        await User.deleteMany({})

        const passwordHash = await bcrypt.hash('sekret', 10)
        const user = new User({ username: 'root', passwordHash })

        await user.save()
    })

    test('creation succeeds with a fresh username', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'travelGravel',
            name: 'Chris Ellis',
            password: 'test',
        }

        await api
            .post('/api/users')
            .send(newUser)
            .expect(200)
            .expect('Content-Type', /application\/json/)

        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

        const usernames = usersAtEnd.map(u => u.username)
        expect(usernames).toContain(newUser.username)
    })

    test('creation fails with proper statuscode and message if username too short', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'm',
            name: 'Superuser',
            password: 'salainen',
        }

        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(result.body.error).toContain("User validation failed: username: Path `username` (`m`) is shorter than the minimum allowed length (3).")

        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toHaveLength(usersAtStart.length)
    })
    test('creation fails with proper statuscode and message if password is too short', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'travelGravel',
            name: 'Superuser',
            password: 't',
        }

        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(result.body.error).toContain("Password is shorter than minimum length (3)")

        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toHaveLength(usersAtStart.length)
    })
})

afterAll(() => {
    mongoose.connection.close()
})