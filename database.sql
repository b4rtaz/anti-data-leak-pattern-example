-- 10.3.16-MariaDB - mariadb.org binary distribution

CREATE TABLE `creditcards` (
	`id` int(11) NOT NULL,
	`login` varchar(128) COLLATE utf8_bin NOT NULL,
	`number` varchar(2048) COLLATE utf8_bin NOT NULL,
	`exp` char(5) COLLATE utf8_bin NOT NULL,
	`cvv2` varchar(2048) COLLATE utf8_bin NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `tokens` (
	`token` char(128) COLLATE utf8_bin NOT NULL,
	`login` varchar(128) COLLATE utf8_bin NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `users` (
	`login` varchar(128) COLLATE utf8_bin NOT NULL,
	`password` varchar(1024) COLLATE utf8_bin NOT NULL,
	`publicKey` varbinary(550) NOT NULL,
	`encryptedPrivateKey` varbinary(2384) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

ALTER TABLE `creditcards`
	ADD PRIMARY KEY (`id`);

ALTER TABLE `tokens`
	ADD PRIMARY KEY (`token`),
	ADD KEY `login` (`login`);

ALTER TABLE `users`
	ADD PRIMARY KEY (`login`);

ALTER TABLE `creditcards`
	MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `tokens`
	ADD CONSTRAINT `tokens_ibfk_1` FOREIGN KEY (`login`) REFERENCES `users` (`login`);
