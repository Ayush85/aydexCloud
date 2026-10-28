<?php
/**
 * Plugin Name: aydex.cloud Analytics
 * Description: Adds the aydex.cloud privacy-friendly analytics script to your site. Cookieless; nothing else is changed.
 * Version: 1.0.0
 * License: MIT
 * Requires at least: 5.0
 * Requires PHP: 7.2
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const AYDEX_DEFAULT_SCRIPT = 'https://t.aydex.cloud/script.js';

function aydex_sanitize_site( $value ) {
	return preg_replace( '/[^A-Za-z0-9_-]/', '', (string) $value );
}

function aydex_sanitize_script( $value ) {
	$url = esc_url_raw( trim( (string) $value ), array( 'https' ) );
	return $url ? $url : AYDEX_DEFAULT_SCRIPT;
}

function aydex_register_settings() {
	register_setting( 'aydex', 'aydex_site_id', array( 'sanitize_callback' => 'aydex_sanitize_site' ) );
	register_setting( 'aydex', 'aydex_script_url', array( 'sanitize_callback' => 'aydex_sanitize_script' ) );
	register_setting( 'aydex', 'aydex_skip_admins', array( 'sanitize_callback' => 'rest_sanitize_boolean', 'default' => true ) );
}
add_action( 'admin_init', 'aydex_register_settings' );

function aydex_menu() {
	add_options_page( 'aydex.cloud', 'aydex.cloud', 'manage_options', 'aydex', 'aydex_settings_page' );
}
add_action( 'admin_menu', 'aydex_menu' );

function aydex_settings_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	?>
	<div class="wrap">
		<h1>aydex.cloud</h1>
		<p>Paste the tracking ID from your aydex.cloud dashboard (Share tab, installation snippet).</p>
		<form method="post" action="options.php">
			<?php settings_fields( 'aydex' ); ?>
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="aydex_site_id">Tracking ID</label></th>
					<td><input type="text" id="aydex_site_id" name="aydex_site_id" class="regular-text" value="<?php echo esc_attr( get_option( 'aydex_site_id', '' ) ); ?>" /></td>
				</tr>
				<tr>
					<th scope="row"><label for="aydex_script_url">Script URL</label></th>
					<td><input type="url" id="aydex_script_url" name="aydex_script_url" class="regular-text" value="<?php echo esc_attr( get_option( 'aydex_script_url', AYDEX_DEFAULT_SCRIPT ) ); ?>" />
					<p class="description">Change only if you run your own aydex instance or a first-party proxy.</p></td>
				</tr>
				<tr>
					<th scope="row">Administrators</th>
					<td><label><input type="checkbox" name="aydex_skip_admins" value="1" <?php checked( get_option( 'aydex_skip_admins', true ) ); ?> /> Do not count visits from logged-in administrators</label></td>
				</tr>
			</table>
			<?php submit_button(); ?>
		</form>
	</div>
	<?php
}

function aydex_print_script() {
	$site = aydex_sanitize_site( get_option( 'aydex_site_id', '' ) );
	if ( '' === $site || is_admin() || is_preview() ) {
		return;
	}
	if ( get_option( 'aydex_skip_admins', true ) && current_user_can( 'manage_options' ) ) {
		return;
	}
	$src = get_option( 'aydex_script_url', AYDEX_DEFAULT_SCRIPT );
	printf(
		'<script defer data-site="%s" src="%s"></script>' . "\n",
		esc_attr( $site ),
		esc_url( $src )
	);
}
add_action( 'wp_head', 'aydex_print_script', 20 );
