import Link from 'next/link';

export default function CommunityNav() {
  return (
    <header className="community-nav">
      <Link className="brand" href="/">
        <span className="brand__mark">F</span>
        <span className="brand__name">Filra<span>Film Rating</span></span>
      </Link>
      <nav aria-label="Navigasi akun">
        <Link href="/community">Teman</Link>
        <Link href="/account">Edit profil</Link>
      </nav>
    </header>
  );
}
