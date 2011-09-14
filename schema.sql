-- phpMyAdmin SQL Dump
-- version 2.11.7.1
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Sep 14, 2011 at 12:46 PM
-- Server version: 5.0.41
-- PHP Version: 5.2.6

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";

--
-- Database: 'europeana'
--

-- --------------------------------------------------------

--
-- Table structure for table 'comments'
--

CREATE TABLE comments (
  comment_id bigint(20) NOT NULL auto_increment,
  cookie_id varchar(128) collate utf8_unicode_ci NOT NULL,
  `timestamp` datetime NOT NULL,
  video_time float NOT NULL,
  `language` char(2) collate utf8_unicode_ci NOT NULL default 'en',
  email varchar(200) collate utf8_unicode_ci default NULL,
  `name` varchar(200) collate utf8_unicode_ci default NULL,
  `comment` varchar(500) collate utf8_unicode_ci default NULL,
  admin_flag tinyint(4) NOT NULL default '0',
  hide tinyint(4) NOT NULL default '0',
  PRIMARY KEY  (comment_id),
  KEY cookie_id (cookie_id),
  KEY `language` (`language`),
  KEY email (email)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table 'cookies'
--

CREATE TABLE cookies (
  cookie_id varchar(128) collate utf8_unicode_ci NOT NULL,
  `language` char(2) collate utf8_unicode_ci NOT NULL default 'en',
  create_time datetime NOT NULL,
  load_time datetime default NULL,
  PRIMARY KEY  (cookie_id),
  KEY `language` (`language`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table 'flag'
--

CREATE TABLE flag (
  comment_id bigint(20) NOT NULL,
  cookie_id varchar(128) collate utf8_unicode_ci NOT NULL,
  `timestamp` datetime NOT NULL,
  PRIMARY KEY  (comment_id,cookie_id)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table 'userCake_Groups'
--

CREATE TABLE userCake_Groups (
  Group_ID int(11) NOT NULL auto_increment,
  Group_Name varchar(225) NOT NULL,
  PRIMARY KEY  (Group_ID)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table 'userCake_Users'
--

CREATE TABLE userCake_Users (
  User_ID int(11) NOT NULL auto_increment,
  Username varchar(150) NOT NULL,
  Username_Clean varchar(150) NOT NULL,
  `Password` varchar(225) NOT NULL,
  Email varchar(150) NOT NULL,
  ActivationToken varchar(225) NOT NULL,
  LastActivationRequest int(11) NOT NULL,
  LostPasswordRequest int(1) NOT NULL default '0',
  Active int(1) NOT NULL,
  Group_ID int(11) NOT NULL,
  SignUpDate int(11) NOT NULL,
  LastSignIn int(11) NOT NULL,
  PRIMARY KEY  (User_ID)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1;
