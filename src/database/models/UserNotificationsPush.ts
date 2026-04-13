import { DataTypes, Model, Sequelize } from 'sequelize';
import { UsersEntity } from '@app/database/index.js';
import { UserNotificationsPushAttributes } from '@app/types/index.js';



class UserNotificationsPushEntity extends Model<UserNotificationsPushAttributes> {

  public static initialize(sequelize: Sequelize) {
    this.init(
      {
        id: {
          type: DataTypes.BIGINT,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        userId: {
          type: DataTypes.BIGINT,
          allowNull: false,
          references: {
            model: UsersEntity,
            key: 'id',
          },
        },
        endpoint: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        keysAuth: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        keysP256dh: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        browser: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        os: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        platform: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: 'user_notifications_push',
        timestamps: true,
        underscored: true,
      }
    );
  }
}

export { UserNotificationsPushEntity, UserNotificationsPushAttributes };
