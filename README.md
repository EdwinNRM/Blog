# Personal Blog

Personal blog with Y2K aesthetic, built with Jekyll and hosted on GitHub Pages.

Inspired by [Seechain](https://seechain.neocities.org).

## Stack

- **Jekyll** - Static site generator
- **GitHub Pages** - Hosting
- **SCSS** - Styling (Windows 98 / Y2K theme)
- **Vanilla JS** - CD Player, emoticons

## Features

- Blog posts with per-post comments (moderated via GitHub Issues)
- Guestbook (moderated via GitHub Issues)
- MSN emoticons picker in guestbook and comments
- CD Player with playlist from `_data/music.yml`
- Y2K/Windows 98 aesthetic throughout

## Local Development

```bash
# Install dependencies
bundle install

# Run local server
bundle exec jekyll serve --baseurl ""

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

## Guestbook & Comments Moderation

Visitors can leave messages via the [Guestbook](https://edwinnrm.github.io/Blog/guestbook/) or on blog posts.

Flow:
1. Visitor fills the form on the site (guestbook or comment)
2. A GitHub Issue is created with the `guestbook` or `comment` label
3. Moderator adds `approved` or `rejected` label to the issue
4. GitHub Actions (`approve.yml`) processes the label:
   - If approved: appends to `_data/guestbook.yml` or `_data/comments/<post-slug>.yml`, commits, pushes, and triggers redeploy
   - If rejected: closes the issue without adding content
5. Site redeploys automatically via `jekyll.yml`

## MSN Emoticons

69 MSN-style emoticons in `assets/images/emoticons/`, mapped in `_data/emoticons.yml`.
Automatic replacement in guestbook and comments. Picker available on guestbook and post comments.

## Project Structure

```
.
├── _config.yml              # Jekyll configuration
├── _data/
│   ├── navigation.yml       # Sidebar menu items
│   ├── music.yml            # Music tracks for CD Player
│   ├── guestbook.yml        # Guestbook entries
│   ├── comments/            # Per-post comments
│   └── emoticons.yml        # MSN emoticon mappings
├── _includes/
│   ├── head.html            # HTML head (favicon, fonts, emoticons JS)
│   ├── sidebar.html         # Sidebar with CD Player
│   └── footer.html          # Footer
├── _layouts/
│   ├── default.html         # Base layout (Win98 window)
│   ├── home.html            # Home page
│   ├── page.html            # Generic page
│   └── post.html            # Blog post (with emoticon picker)
├── _posts/                  # Blog posts
├── _sass/                   # SCSS partials
├── assets/
│   ├── audio/               # MP3 files for CD Player
│   ├── css/main.scss        # SCSS entry point
│   ├── images/
│   │   ├── emoticons/       # 69 MSN emoticon GIFs
│   │   ├── favicon.ico      # Site favicon
│   │   └── cover-default.png
│   └── js/
│       ├── main.js          # Site JS
│       ├── player.js        # CD Player
│       └── emoticons.js     # MSN emoticon replacement + picker
├── pages/                   # Static pages
│   ├── guestbook.md         # Guestbook page
│   ├── sitemap.md           # Visual sitemap
│   └── ...
├── .github/workflows/
│   ├── jekyll.yml           # Build and deploy to GitHub Pages
│   └── approve.yml          # Guestbook/comment moderation
└── add_music.py             # Music metadata script
```

## License

Personal project. All rights reserved.
