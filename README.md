# Personal Blog

Personal blog with Y2K aesthetic, built with Jekyll and hosted on GitHub Pages.

Inspired by [Seechain](https://seechain.neocities.org).

## Stack

- **Jekyll** - Static site generator
- **GitHub Pages** - Hosting
- **SCSS** - Styling (Windows 98 / Y2K theme)
- **Vanilla JS** - Music player

## Local Development

```bash
# Install dependencies
bundle install

# Run local server
bundle exec jekyll serve --baseurl=""

# Open http://localhost:4000
```

## Adding Music

1. Place your MP3 files in `assets/audio/`
2. Run the script to auto-fill metadata:

```bash
# Add a specific file
python add_music.py assets/audio/my-song.mp3

# Add multiple files
python add_music.py assets/audio/*.mp3

# Scan folder and add all MP3s
python add_music.py --scan
```

The script reads ID3 tags (title, artist, album, year) and updates `_data/music.yml`.

### Manual Edit

You can also edit `_data/music.yml` directly:

```yaml
- title: "Song Name"
  artist: "Artist"
  album: "Album"
  year: "2024"
  file: "song-name.mp3"
```

The `file` field must match the MP3 filename in `assets/audio/`.

## Guestbook

Visitors can leave messages via the [Guestbook](https://edwinnrm.github.io/guestbook/).

Flow:
1. Visitor fills the form on the site
2. A GitHub Issue is created with the `guestbook` label
3. GitHub Actions processes the issue and adds it to `_data/guestbook.yml`
4. Site redeploys automatically

## Project Structure

```
.
├── _config.yml              # Jekyll configuration
├── _data/
│   ├── navigation.yml       # Sidebar menu items
│   ├── music.yml            # Music tracks for player
│   └── guestbook.yml        # Guestbook entries
├── _includes/
│   ├── head.html            # HTML head
│   ├── sidebar.html         # Sidebar with player
│   └── footer.html          # Footer
├── _layouts/
│   ├── default.html         # Base layout (Win98 window)
│   ├── home.html            # Home page
│   ├── page.html            # Generic page
│   └── post.html            # Blog post
├── _posts/                  # Blog posts
├── _sass/                   # SCSS partials
├── assets/
│   ├── audio/               # MP3 files for player
│   ├── css/main.scss        # SCSS entry point
│   └── js/
│       ├── main.js          # Site JS
│       └── player.js        # Music player
├── pages/                   # Static pages
├── .github/workflows/
│   └── guestbook.yml        # Guestbook automation
└── add_music.py             # Music metadata script
```

## License

Personal project. All rights reserved.
