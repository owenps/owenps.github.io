# owenps.github.io

[![Deploy to GitHub Pages](https://github.com/owenps/owenps.github.io/actions/workflows/hugo.yml/badge.svg)](https://github.com/owenps/owenps.github.io/actions/workflows/hugo.yml)

This is my personal website. Hopefully it is live: https://owenps.github.io

Built with ❤︎ using [Hugo](https://gohugo.io/), an ultra light-weight static site generator. Uses the [hugo-bearblog](https://github.com/janraasch/hugo-bearblog) theme.

## Development

> [!IMPORTANT]  
> All `hugo` commands must be run from the `owensmith` root directory.

### Quick Start

To host locally for testing run

```sh
hugo server
```

Use the `-D` flag to compile with draft pages.

Which will build a HTTP server running on your local machine. It will auto-build on any local changes you make.

### Adding New Pages

All pages can be found under the `owensmith/content` directory. Blog posts use [page bundles](https://gohugo.io/content-management/page-bundles/) — each post is a folder with an `index.md` inside it.

Create a new blog post:

```sh
hugo new blog/my-new-blog/index.md
```

Images and other assets go in the same folder as the post's `index.md` and are referenced with a relative path:

```markdown
![alt text](my-image.png)
```

## Update Submodules

Submodules do not update automatically. To update the Hugo theme, run:

```sh
git submodule update --remote owensmith/themes/hugo-bearblog
```
