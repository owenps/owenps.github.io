# owenps.github.io

This is my personal website / blog. Hopefully it is live [here](https://owenps.github.io).

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

All blogs posts go under `owensmith/content/posts` to add a new draft with
```sh
hugo new content content/posts/my-new-post.md
```

You can build the site with all drafts included using 

```sh
hugo server -D
```

When you are ready to deploy the site, be sure any drafts that you want to publish have `draft = false`. Then run

```sh
hugo
```



