<?php
/**
 * TruthRouter AI  secrets file.
 *
 * Upload this file ONE LEVEL ABOVE public_html, as a sibling folder to it,
 * never inside public_html itself. That keeps it unreachable by any URL.
 *
 * review.php automatically requires this file if it finds it there, so
 * nothing else needs to change once this is in place.
 *
 * Replace the placeholder values below with your real key and, if your
 * provider issues one, your real signing secret. Do not commit this file
 * to a public GitHub repository.
 */

putenv('AGENT_ROUTER_API_KEY=sk-ant-replace-with-your-real-key');
putenv('AGENT_ROUTER_API_SECRET=replace-with-your-signing-secret');
