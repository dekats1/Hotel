package com.hotel.booking.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PageController {

    @GetMapping("/")
    public String home() {
        return "forward:/html/home.html";
    }

    @GetMapping("/home")
    public String homePage() {
        return "forward:/html/home.html";
    }

    @GetMapping("/login")
    public String loginPage() {
        return "forward:/html/authentication/login.html";
    }

    @GetMapping("/register")
    public String registerPage() {
        return "forward:/html/authentication/register.html";
    }

    @GetMapping("/aboutUs")
    public String aboutPage() {
        return "forward:/html/aboutUs.html";
    }

    @GetMapping("/booking")
    public String bookingPage() {
        return "forward:/html/menu/booking.html";
    }

    @GetMapping("/profile")
    public String profilePage() {
        return "forward:/html/menu/profile.html";
    }

    @GetMapping("/setting")
    public String settingPage() {
        return "forward:/html/menu/setting.html";
    }

    @GetMapping("/wallet")
    public String walletPage() {
        return "forward:/html/menu/wallet.html";
    }

    @GetMapping("/admin")
    public String adminPage() {return "forward:/html/menu/profileAdmin.html";}

    @GetMapping("catalog")
    public String catalogPage() {return "forward:/html/catalog/catalogRoom.html";}
}