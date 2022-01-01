const lodash = require('lodash')

const dummy = (blogs) => {
    return 1;
}

const totalLikes = (blogs) => {
    const reducer = (sum, blog) => {
        return sum + blog.likes
    }
    return blogs.reduce(reducer, 0)
}

const favoriteBlog = (blogs) => {
    const favoriteBlog = blogs.reduce((a, b) => a.likes > b.likes ? a : b)
    return {
        title: favoriteBlog.title,
        author: favoriteBlog.author,
        likes: favoriteBlog.likes
    }
}

const mostBlogs = (blogs) => {
    const blogObject = lodash.countBy(blogs, 'author');
    const keys = Object.keys(blogObject);
    return {
        author: keys[0],
        blogs: blogObject[`${keys[0]}`]
    }
}

const mostLikes = (blogs) => {
    const blogObject = lodash.groupBy(blogs, 'author');
    const keys = Object.keys(blogObject);
    const a = []
    keys.forEach(key => {
        const authorGroup = blogObject[`${key}`]
        const b = lodash.reduce(authorGroup, function (sum, n) {
            return sum + n.likes
        }, 0)
        a.push({
            author: key,
            likes: b
        })
    })
    return a.reduce((c, d) => c.likes > d.likes ? c : d)
}

module.exports = {
    dummy,
    totalLikes,
    favoriteBlog,
    mostBlogs,
    mostLikes
}