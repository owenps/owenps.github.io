# owenps.github.io

[![Deploy to GitHub Pages](https://github.com/owenps/owenps.github.io/actions/workflows/hugo.yml/badge.svg)](https://github.com/owenps/owenps.github.io/actions/workflows/hugo.yml)

This is my personal website. Hopefully it is live: https://owenps.github.io

Built with ❤︎ using [Hugo](https://gohugo.io/), an ultra light-weight static site generator. Uses the [hugo-bearblog](https://github.com/janraasch/hugo-bearblog) theme.

## Development

> [!NOTE]  
> All `hugo` commands must be run from the `owensmith` root directory.

### Quick Start

To host locally for testing run

```sh
hugo server
```

Use the `-D` flag to compile with draft pages.

Which will build a HTTP server running on your local machine. It will auto-build on any local changes you make.

### Adding New Pages

All pages can be found under the `owensmith/content` directory. Create a new draft page with

```sh
hugo new my-new-page.md
```

Or to create a new blog post

```sh
hugo new blog/my-new-blog.md
```

## Update Sub Modules

Sub Modules do not update automatically, to pull down the latest you'll need to run

```sh
git submodule update --remote chatdemo
```

Check the `.gitmodules` file for the all module names.
