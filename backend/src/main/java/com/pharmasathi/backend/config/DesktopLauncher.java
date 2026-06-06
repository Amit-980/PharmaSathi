package com.pharmasathi.backend.config;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.awt.Desktop;
import java.net.URI;

@Component
public class DesktopLauncher {

    @EventListener(ApplicationReadyEvent.class)
    public void openApplication() {
        if (!Boolean.parseBoolean(System.getProperty("pharmasathi.open-browser", "false"))) {
            return;
        }

        try {
            if (Desktop.isDesktopSupported()) {
                Desktop.getDesktop().browse(URI.create("http://127.0.0.1:8765"));
            }
        } catch (Exception exception) {
            System.err.println("Open http://127.0.0.1:8765 in a browser.");
        }
    }
}
