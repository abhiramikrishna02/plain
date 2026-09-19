import Image from "next/image";

const SOCIAL_LINKS = [
	{
		label: "LinkedIn",
		href: "https://www.linkedin.com/company/plain-culture/",
	},
	{
		label: "Instagram",
		href: "https://www.instagram.com/plain.india?stkn=aGEwemIxM2t1aW9l",
	},
];

const NAV_LINKS = [
	{ label: "Home", href: "#home" },
	{ label: "Products", href: "#products" },
	{ label: "About", href: "#about" },
	{ label: "Contact", href: "#contact" },
];

const CONTACT_LINKS = [
	{ label: "+91 00000 00000", href: "tel:+910000000000" },
	{ label: "hello@plainculture.in", href: "mailto:hello@plainculture.in" },
];

export default function Footer() {
	return (
		<footer className="bg-[#1a1a1a] text-[#F7E8C8]">
			<div className="mx-auto grid w-full max-w-[1536px] gap-12 px-6 py-12 sm:px-8 md:grid-cols-2 lg:grid-cols-4 lg:px-20">
				<div>
					<Image
						src="/logo.png"
						alt="Plain Culture"
						width={144}
						height={70}
						className="h-14 w-auto object-contain"
					/>
					<p className="mt-5 max-w-xs text-sm leading-6 text-[#F7E8C8]/65">
						Rooted in goodness. Made for everyday living.
					</p>
				</div>

				<div>
					<p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F7E8C8]/50">
						Explore
					</p>
					<div className="mt-5 flex flex-col items-start gap-3">
						{NAV_LINKS.map((link) => (
							<a
								key={link.label}
								href={link.href}
								className="text-sm transition-colors hover:text-[#B7E51B]"
							>
								{link.label}
							</a>
						))}
					</div>
				</div>

				<div>
					<p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F7E8C8]/50">
						Contact
					</p>
					<div className="mt-5 flex flex-col items-start gap-3">
						{CONTACT_LINKS.map((link) => (
							<a
								key={link.label}
								href={link.href}
								className="text-sm transition-colors hover:text-[#B7E51B]"
							>
								{link.label}
							</a>
						))}
					</div>
				</div>

				<div>
					<p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F7E8C8]/50">
						Follow Plain Culture
					</p>
					<div className="mt-5 flex flex-wrap gap-3">
						{SOCIAL_LINKS.map((link) => (
							<a
								key={link.label}
								href={link.href}
								target="_blank"
								rel="noreferrer"
								className="rounded-full border border-[#F7E8C8]/25 px-5 py-2.5 text-sm font-medium transition-colors hover:border-[#B7E51B] hover:text-[#B7E51B]"
							>
								{link.label}
							</a>
						))}
					</div>
				</div>
			</div>

			<div className="border-t border-[#F7E8C8]/10">
				<div className="mx-auto w-full max-w-[1536px] px-6 py-5 text-xs text-[#F7E8C8]/45 sm:px-8 lg:px-20">
					© {new Date().getFullYear()} Plain Culture. All rights reserved.
				</div>
			</div>
		</footer>
	);
}
