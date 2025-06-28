# owenps.github.io

[![Deploy to GitHub Pages](https://github.com/owenps/owenps.github.io/actions/workflows/hugo.yml/badge.svg)](https://github.com/owenps/owenps.github.io/actions/workflows/hugo.yml)

This is my personal website / blog. Hopefully it is live [here](https://owenps.github.io) 🙏

Built with ❤︎ using [Hugo](https://gohugo.io/), an ultra light-weight static site generator. Uses the [hugo-bearblog](https://github.com/janraasch/hugo-bearblog) theme.

> [!NOTE]  
> All `hugo` commands must be run from the `owensmith` root directory.

## Development

### Quick Start

To host locally for testing run
```sh
hugo server
```

Which will build a HTTP server running on your local machine. It will auto-build on any local changes you make.

### Adding New Posts

All pages can be found under the `owensmith/content` directory. Create a new draft page with
```sh
hugo new my-new-page.md
```

Or to create a new blog post
```sh
hugo new blog/my-new-blog.md
```

You can build the site with all drafts included using 

```sh
hugo server -D
```

When you are ready to deploy the site, be sure any drafts that you want to publish have `draft = false`. Then run

```sh
hugo
```



