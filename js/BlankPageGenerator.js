// will set up an empty page with a navigation and search bar
window.addEventListener('DOMContentLoaded', (event) => {
  document.body.innerHTML = `
<nav class="navbar navbar-expand-lg navbar-light bg-light">
        <div class="container-fluid">
          <a class="navbar-brand" href="#"><i class="bi-cpu" role="img" aria-label="logo"></i>
            <b>Owen</b> Smith</a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarColor03" aria-controls="navbarColor03" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>
      
          <div class="collapse navbar-collapse" id="navbarColor03">
            <ul class="navbar-nav me-auto">
              <li class="nav-item">
                <a class="nav-link" id="navHome" href="#">Home
                  <span class="visually-hidden">(current)</span>
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" id="navBlog" href="#">Blog</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" id="navResume" href="assets/pdf/OwenSmith_Resume.pdf">Resume</a>
              </li>
              <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" id="navSocials" data-bs-toggle="dropdown" href="#" role="button" aria-haspopup="true" aria-expanded="false">Socials</a>
                <div class="dropdown-menu">
                  <a class="dropdown-item" href="https://linkedin.com/in/owenpsmith">
                    <i class="bi-linkedin" role="img" aria-label="LinkedIn"></i>
                    LinkedIn
                  </a>
                  <a class="dropdown-item" href="https://github.com/owenps">
                    <i class="bi-github" role="img" aria-label="GitHub"></i>
                    GitHub
                  </a>
                  <a class="dropdown-item" href="mailto:owen.smith@mail.mcgill.ca">
                    <i class="bi-mailbox" role="img" aria-label="Mailbox"></i>
                    Email
                  </a>
                </div>
              </li>
            </ul>
            <form class="d-flex">
              <input class="form-control me-sm-2" type="text" placeholder="Search">
              <button class="btn btn-secondary my-2 my-sm-0" type="submit">
                <i class="bi-search" role="img" aria-label="Search"></i>
              </button>
            </form>
          </div>
        </div>
      </nav>
`;
});
