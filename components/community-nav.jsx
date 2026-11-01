import DocumentLink from './document-link';

export default function CommunityNav() {
  return (
    <header className="community-nav">
      <DocumentLink className="brand" href="/">
        <span className="brand__mark">F</span>
        <span className="brand__name">Filra<span>Film Rating</span></span>
      </DocumentLink>
      <nav aria-label="Navigasi akun">
        <DocumentLink href="/minigames">Minigames</DocumentLink>
        <DocumentLink href="/community">Teman</DocumentLink>
        <DocumentLink href="/account">Profil saya</DocumentLink>
      </nav>
    </header>
  );
}
