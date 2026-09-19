"use client";

import { useState } from "react";

export default function Contact() {
	const [submitted, setSubmitted] = useState(false);

	function handleSubmit(event) {
		event.preventDefault();
		setSubmitted(true);
		event.currentTarget.reset();
	}

	return (
		<section
			id="contact"
			className="bg-[#F7E8C8] px-6 py-20 text-[#1A1A1A] sm:px-8 lg:px-20 lg:py-28"
			aria-labelledby="contact-title"
		>
			<div className="mx-auto grid w-full max-w-[1536px] gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-24">
				<div>
					<p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#004C33]/65">
						Get in touch
					</p>
					<h2
						id="contact-title"
						className="mt-5 max-w-xl text-5xl font-semibold leading-none tracking-tight sm:text-6xl"
						style={{ fontFamily: "Georgia, serif" }}
					>
						Let&apos;s keep it plain.
					</h2>
					<p className="mt-6 max-w-md text-base leading-7 text-[#1A1A1A]/70">
						Questions about our range, partnerships, or where to find us? Send us a note and we&apos;ll get back to you.
					</p>

					<div className="mt-10 flex flex-col gap-4 text-sm">
						<a className="w-fit font-medium transition-colors hover:text-[#004C33]" href="mailto:hello@plainculture.in">
							hello@plainculture.in
						</a>
						<a className="w-fit font-medium transition-colors hover:text-[#004C33]" href="tel:+910000000000">
							+91 00000 00000
						</a>
					</div>
				</div>

				<form className="grid gap-5" onSubmit={handleSubmit}>
					<label className="grid gap-2 text-sm font-medium" htmlFor="contact-name">
						Name
						<input
							id="contact-name"
							name="name"
							type="text"
							required
							className="min-h-12 border-b border-[#1A1A1A]/25 bg-transparent px-0 outline-none transition-colors placeholder:text-[#1A1A1A]/40 focus:border-[#004C33]"
							placeholder="Your name"
						/>
					</label>

					<label className="grid gap-2 text-sm font-medium" htmlFor="contact-email">
						Email
						<input
							id="contact-email"
							name="email"
							type="email"
							required
							className="min-h-12 border-b border-[#1A1A1A]/25 bg-transparent px-0 outline-none transition-colors placeholder:text-[#1A1A1A]/40 focus:border-[#004C33]"
							placeholder="you@example.com"
						/>
					</label>

					<label className="grid gap-2 text-sm font-medium" htmlFor="contact-message">
						Message
						<textarea
							id="contact-message"
							name="message"
							required
							rows="4"
							className="resize-y border-b border-[#1A1A1A]/25 bg-transparent px-0 py-3 outline-none transition-colors placeholder:text-[#1A1A1A]/40 focus:border-[#004C33]"
							placeholder="How can we help?"
						/>
					</label>

					<div className="flex flex-wrap items-center gap-5 pt-3">
						<button
							type="submit"
							className="rounded-full bg-[#004C33] px-7 py-3.5 text-sm font-semibold text-[#F7E8C8] transition-transform hover:scale-105"
						>
							Send message
						</button>
						{submitted && <p className="text-sm text-[#004C33]">Thanks, we&apos;ll be in touch.</p>}
					</div>
				</form>
			</div>
		</section>
	);
}
